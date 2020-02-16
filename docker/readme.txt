部署WebRTC Backup Server:
1、准备Redis服务器：您需事先准备一台Redis服务器，单例或集群均可，并记住连接地址。单例Redis需要2.8版本以上，集群Redis需要3.0以上
2、登记Redis连接地址：修改配置文件config.json，请将Redis的集群地址登记在本目录下的config.json文件的此节点上：namespaces->signalRedis->extra->nodes，
若redis连接无需密码，请将password属性删除
3、生成Docker Image：Redis服务器的连接地址配置好后，你就可以通过该目录下的Dockerfile文件生成该Backup Server的Docker镜像包了。
该文件默认导出2770端口，你可以修改成你想要的端口。打包命令：docker build -t="{imageName}:{versionName}" .  
4、部署并运行Backup Server: 在你的服务器上部署并运行多个Backup Server的Docker容器, 数量理论上不限制，数量越多，并发性能越好。
5、分发连接：你还需要一台Nginx或相同功能的服务器，将客户端的请求连接分发到不同的Backup Server，实现负载均衡。