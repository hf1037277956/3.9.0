#!/usr/bin/sh
export LANG=en_US.UTF-8

exeFileName='SPT.Server'
# serverPath='/home/server_3.8.3/'

# uuid=$(uuidgen)

pid=`ps aux | grep "$exeFileName" | grep -v grep | awk '{print $2}'`

if [ -n "$pid" ]; then
    /usr/bin/kill -9 $pid
    echo "$(date +'%Y-%m-%d %H:%M:%S') 检测到服务端正在运行，杀掉进程PID: $pid"
fi

# cd $serverPath
nohup ./$exeFileName >> aki.log 2>&1 &
pid=$!
echo "$(date +'%Y-%m-%d %H:%M:%S') 启动服务: $pid"
