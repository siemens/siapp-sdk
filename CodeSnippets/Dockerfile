FROM alpine

EXPOSE 22

# !!! SET YOUR SSH PASSWORD HERE !!! (replace CHANGE_ME with your password)
ARG SSH_PASSWORD=CHANGE_ME

RUN apk add --no-cache libstdc++ libgcc g++

RUN apk add openrc
RUN sed -i '/getty/d' /etc/inittab

#set sshlogin to Port 22 with password authentication
RUN apk add --no-cache openssh \
	&& sed -i 's/#Port.*/Port 22/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config \
	&&  /usr/bin/ssh-keygen -A \
	&&  rc-update add sshd

# Fail build if password was not changed from default
RUN test "$SSH_PASSWORD" != "CHANGE_ME" \
	|| { printf '\n\n  *** ERROR: Set your SSH password in the Dockerfile! ***\n\n'; false; } \
	&& echo "root:$SSH_PASSWORD" | chpasswd 
	
COPY src /src
COPY edgedataapi /edgedataapi

RUN g++ -std=c++11 -Wcpp -Wno-psabi -I /usr/include -I /edgedataapi/include -o /hellosiapp /src/hellosiapp.c /edgedataapi/src/edgedata.cpp
RUN g++ -std=c++11 -Wcpp -Wno-psabi -I /usr/include -I /edgedataapi/include -I /src -o /simple_dido /src/simple_dido.c /src/helper.c /edgedataapi/src/edgedata.cpp
RUN g++ -std=c++11 -Wcpp -Wno-psabi -I /usr/include -I /edgedataapi/include -I /src -o /subscribe /src/subscribe.c /src/helper.c /edgedataapi/src/edgedata.cpp
RUN g++ -std=c++11 -Wcpp -Wno-psabi -I /usr/include -I /edgedataapi/include -I /src -o /discover /src/discover.c /src/helper.c /edgedataapi/src/edgedata.cpp

RUN chmod +x /hellosiapp /simple_dido /subscribe /discover

#enable for a smaller release without compiler
RUN apk del g++

WORKDIR /

# conntect via ssh and run /hellosiapp, /simple_dido, /subscribe or /discover
ENTRYPOINT ["/sbin/init"]