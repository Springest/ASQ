FROM ruby:2.3

# Install requirements for app
RUN apt-get update \
  && apt-get install -y build-essential nodejs \
    libmysqlclient-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENV APP_HOME /home/asq/

RUN mkdir $APP_HOME

WORKDIR $APP_HOME

COPY . $APP_HOME

RUN bundle install --jobs=8

EXPOSE 3000

CMD $APP_HOME/docker_runner.rb
