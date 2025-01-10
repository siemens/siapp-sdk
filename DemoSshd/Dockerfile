FROM alpine

EXPOSE 22

RUN apk add openrc
RUN sed -i '/getty/d' /etc/inittab

#set sshlogin to Port 22 with no password
RUN apk add --no-cache openssh \
	&& sed -i 's/#Port.*/Port 22/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PermitEmptyPasswords.*/PermitEmptyPasswords yes/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config \
	&&  /usr/bin/ssh-keygen -A \
	&&  passwd -d root \
	&&  rc-update add sshd

# Connect via SSH
CMD ["/sbin/init"]
