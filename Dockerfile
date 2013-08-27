FROM ubuntu:12.04
# python-software-properties is required for add-apt-repository.
RUN apt-get install -y python-software-properties
RUN add-apt-repository -y ppa:brightbox/ruby-ng-experimental
RUN apt-get update
RUN apt-get -y upgrade
RUN apt-get install -y ruby2.0 ruby2.0-dev ruby2.0-doc build-essential libxml2-dev libxslt1-dev libcurl3-gnutls-dev git libstdc++6
RUN gem install bundler -v 1.3.5
RUN useradd asq
RUN mkdir /home/asq
ADD . /home/asq
RUN apt-get install -y libmysqlclient-dev
RUN cd /home/asq && bash -l -c 'bundle install'
CMD su asq -c /home/asq/docker_runner.rb

EXPOSE 3000
