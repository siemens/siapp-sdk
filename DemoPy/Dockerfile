FROM alpine

# ENV HTTP_PROXY "http://A.B.C.D:X"
EXPOSE 22

RUN apk add --no-cache libstdc++ libgcc g++ python3

RUN echo '@edge http://dl-cdn.alpinelinux.org/alpine/edge/main' >> /etc/apk/repositories \
    && echo '@edgecommunity http://dl-cdn.alpinelinux.org/alpine/edge/community' >> /etc/apk/repositories \
    && echo '@testing http://dl-cdn.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories \
    && apk add --no-cache openrc su-exec ca-certificates wait4ports \
    # Disable getty's
    && sed -i 's/^\(tty\d\:\:\)/#\1/g' /etc/inittab \
    && sed -i \
        # Change subsystem type to "docker"
        -e 's/#rc_sys=".*"/rc_sys="docker"/g' \
        # Allow all variables through
        -e 's/#rc_env_allow=".*"/rc_env_allow="\*"/g' \
        # Start crashed services
        -e 's/#rc_crashed_stop=.*/rc_crashed_stop=NO/g' \
        -e 's/#rc_crashed_start=.*/rc_crashed_start=YES/g' \
        # Define extra dependencies for services
        -e 's/#rc_provide=".*"/rc_provide="loopback net"/g' \
        /etc/rc.conf \
    # Remove unnecessary services
    && rm -f /etc/init.d/hwdrivers \
            /etc/init.d/hwclock \
            /etc/init.d/hwdrivers \
            /etc/init.d/modules \
            /etc/init.d/modules-load \
            /etc/init.d/modloop \
    # Can't do cgroups
    && sed -i 's/\tcgroup_add_service/\t#cgroup_add_service/g' /lib/rc/sh/openrc-run.sh \
    && sed -i 's/VSERVER/DOCKER/Ig' /lib/rc/sh/init.sh

# set sshlogin to Port 22 with no password
RUN apk add --no-cache openssh \
	&& sed -i 's/#Port.*/Port 22/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PermitEmptyPasswords.*/PermitEmptyPasswords yes/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config \
	&&  /usr/bin/ssh-keygen -A \
	&&  passwd -d root \
	&&  rc-update add sshd 
	
# create own service:
# https://github.com/OpenRC/openrc/blob/master/service-script-guide.md

COPY src /src
COPY edgedataapi /edgedataapi

RUN g++ -std=c++11 -shared -Wcpp -Wno-psabi -I /edgedataapi/include -o /edgedata.so -fPIC /edgedataapi/src/edgedata.cpp

# enable for a smaller release without compiler
RUN apk del g++

COPY src/edgedataapi.py /edgedataapi.py
COPY src/run.py /run.py

RUN chmod +x /run.py /edgedataapi.py

WORKDIR /
# conntect via ssh and run the run.py

ENTRYPOINT ["/sbin/init"]