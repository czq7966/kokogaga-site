local UserChannelKey = '/user:'
local UserStreamRoomKey = '/stream#'
local RoomChannelKey = '/room:'
local RoomUsersChannelKey = '/users:'
local ServerChannelKey = '/server:'
local ServerChannelExistKey = '/exist:'
local ServerChannelUsersKey = '/users:'
local function getNamespacePrefixByUserChannel(userChannel)
    local idx = string.find(userChannel, UserChannelKey)
    if (idx ~= nil) then
        return string.sub(userChannel, 1, idx - 1)
    end
end

local function delRoomChannelUser(roomChannel, userChannel)
    local roomUsersChannel = roomChannel + RoomUsersChannelKey;
    redis.call('hdel', roomUsersChannel, userChannel)
    local count = redis.call('hlen', roomUsersChannel)
    if (count == 0) then
        redis.call('del', roomChannel)
    end
end

local function delRoomUser(roomId, userChannel)
    local namespacePrefix = getNamespacePrefixByUserChannel(userChannel)
    local roomChannel = namespacePrefix + RoomChannelKey + roomId
    delRoomChannelUser(roomChannel, userChannel)
end

local function delUserChannel(serverChannel, userChannel, serverUser)
	local userStr = redis.call('get', userChannel)
    if (userStr ~= nil) then        
        local user = cjson.decode(userStr)
        if ((user.room.id == serverUser.room.id) and (string.find(serverChannel, user.serverId) ~= nil)) then
            local namespacePrefix = getNamespacePrefixByUserChannel(userChannel)
            local roomChannel = namespacePrefix + RoomChannelKey + user.room.id
            local userStreamRoomChannel = roomChannel + UserStreamRoomKey + user.id
            local userStreamRoomUsersChannel = userStreamRoomChannel + RoomUsersChannelKey
            redis.call('del', userStreamRoomChannel)
            redis.call('del', userStreamRoomUsersChannel)            
            delRoomChannelUser(roomChannel, userChannel)
            redis.call('del', userChannel)
        end
    end	
    
end


local function delServerChannel(serverChannel)
    local serverExistChannel = serverChannel + ServerChannelExistKey;
    local serverUsersChannel = serverChannel + ServerChannelUsersKey;

    local users = redis.call('hkeys', serverUsersChannel)
    if (users ~= nill) then
        for userChannel, v in ipairs(users) do
            local userStr = redis.call('hget', serverUsersChannel, userChannel)
            local user = cjson.decode(userStr)
            delUserChannel(serverChannel, userChannel, user)
        end
    end
    redis.call('del', serverExistChannel)
    redis.call('del', serverUsersChannel)    
end

local function delServersChannel(serversChannel)
    local servers = redis.call('hget', serversChannel)
    local delServers = {}
    if (servers ~= nil) then
        for serverChannel, v in ipairs(servers) do
            local serverExistChannel = serverChannel + ServerChannelExistKey
            local serverExist = redis.call('get', serverExistChannel)
            if (serverExist == nil) then                
                delServerChannel(serverChannel)                                    
                delServers[serverChannel] = 'deleted'
            end
        end        
    end
    return delServers
end

return delServersChannel(KEYS[1])