#!/usr/bin/sh
export LANG=en_US.UTF-8

exeFileName='SPT.Server'

# uuid=$(uuidgen)

pid=`ps aux | grep "$exeFileName" | grep -v grep | awk '{print $2}'`

if [ -n "$pid" ]; then
    /usr/bin/kill -9 $pid
    echo "$uuid $(date +'%Y-%m-%d %H:%M:%S') 检测到服务端正在运行，杀掉进程PID: $pid"
fi
