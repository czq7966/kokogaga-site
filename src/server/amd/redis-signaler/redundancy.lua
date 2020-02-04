local UserChannelKey = '/user:'
local UserShortChannelKey = '/short:'
local UserStreamRoomKey = '/stream#'
local RoomChannelKey = '/room:'
local RoomUsersChannelKey = '/users:'
local ServerChannelKey = '/server:'
local ServerChannelExistKey = '/exist:'
local ServerChannelUsersKey = '/users:'
local NamespaceChannelKey = '/namespace:'
local RedundanceRoomChannels = {}
local function getNamespacePrefixByUserChannel(userChannel)
    local idx = string.find(userChannel, UserChannelKey, 1, true)
    if (idx ~= nil) then
        return string.sub(userChannel, 1, idx - 1)
    end
end

local function getNamespaceByChannel(channel)
    local idx1, idx2 = string.find(channel, NamespaceChannelKey, 1, true)
    if (idx2 ~= nil) then
        local namespace = string.sub(channel, idx2 + 1)
        local idx = string.find(namespace, '/', 1, true)
        if (idx ~= nil) then
            namespace = string.sub(namespace, 1, idx - 1)
        end
        return namespace
    end
end

local function getRoomidByRoomChannel(channel)
    local idx1, idx2 = string.find(channel, RoomChannelKey, 1, true)
    if (idx2 ~= nil) then
        local roomid = string.sub(channel, idx2 + 1)
        return roomid
    end
end

local function publishCommand(channel, cmdStr)
    redis.call('publish', channel, cmdStr)
end

local function publishNetworkException(roomChannel)
    local namespace = getNamespaceByChannel(roomChannel)
    local roomid = getRoomidByRoomChannel(roomChannel)
    local data = {
        cmdId = 'network_exception',
        props = {},            
        from = { type = 'server', id = '' },
        to = { type = 'room', id = roomid }       
    }
    local extra = {
        props = {namespace = namespace, includeSelf = true },
        from = { type = 'server', id = 'redis' },
        to = { type = 'room', id = roomid }        
    }
    local cmd = {
        cmdId = 'signal_center_deliver',
        props = data,
        extra = extra,
        from = { type = 'server', id = 'redis' },
        to = { type = 'room', id = roomid }
    }
    local cmdStr = cjson.encode(cmd)
    publishCommand(roomChannel, cmdStr)
end

local function delRoomChannelUser(roomChannel, userChannel)
    local roomUsersChannel = roomChannel..RoomUsersChannelKey;
    redis.call('hdel', roomUsersChannel, userChannel)
    local count = redis.call('hlen', roomUsersChannel)
    if (count == 0) then
        redis.call('del', roomChannel)
        RedundanceRoomChannels[roomChannel] = nil
    else
        RedundanceRoomChannels[roomChannel] = true
    end
end

local function delRoomUser(roomId, userChannel)
    local namespacePrefix = getNamespacePrefixByUserChannel(userChannel)
    local roomChannel = namespacePrefix + RoomChannelKey + roomId
    delRoomChannelUser(roomChannel, userChannel)
end

local function delUserChannel(serverChannel, userChannel, serverUser)
	local userStr = redis.call('get', userChannel)
    if (userStr ~= false) then        
        local user = cjson.decode(userStr)
        local isServerUser = string.find(serverChannel, user.serverId, 1, true) ~= nil
        if ((user.room.id == serverUser.room.id) and (isServerUser == true)) then
            local namespacePrefix = getNamespacePrefixByUserChannel(userChannel)
            local roomChannel = namespacePrefix..RoomChannelKey..user.room.id
            local userShortChannel = namespacePrefix..UserShortChannelKey..user.sid
            local userStreamRoomChannel = roomChannel..UserStreamRoomKey..user.id
            local userStreamRoomUsersChannel = userStreamRoomChannel..RoomUsersChannelKey
            redis.call('del', userStreamRoomChannel)
            redis.call('del', userStreamRoomUsersChannel)            
            delRoomChannelUser(roomChannel, userChannel)
            redis.call('del', userShortChannel)
            redis.call('del', userChannel)
        end
    end	
    
end

local function delServerChannel(serverChannel)
    local serverExistChannel = serverChannel..ServerChannelExistKey;
    local serverUsersChannel = serverChannel..ServerChannelUsersKey;

    local users = redis.call('hkeys', serverUsersChannel)
    for idx, userChannel in ipairs(users) do
        local userStr = redis.call('hget', serverUsersChannel, userChannel)
        local user = cjson.decode(userStr)
        delUserChannel(serverChannel, userChannel, user)
    end

    redis.call('del', serverExistChannel)
    redis.call('del', serverUsersChannel)    
end

local function publishRedundanceRoomChannels(roomChannels)
    for roomChannel, result in pairs(roomChannels) do
        if (result == true) then
            publishNetworkException(roomChannel)
        end
    end    
end

local function delServersChannel(serversChannel)
    local servers = redis.call('hkeys', serversChannel)
    local delServers = {}    

    for idx, serverChannel in ipairs(servers) do
        local serverExistChannel =  serverChannel..ServerChannelExistKey
        local serverExist = redis.call('get', serverExistChannel)
        if (serverExist == false) then                                
            delServerChannel(serverChannel)
            redis.call('hdel', serversChannel, serverChannel)
            delServers[serverChannel] = 'deleted'
        end
    end       
    publishRedundanceRoomChannels(RedundanceRoomChannels)
    RedundanceRoomChannels = {}
    return cjson.encode(RedundanceRoomChannels)
end

return delServersChannel(KEYS[1])