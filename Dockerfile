FROM springest/ruby:2.1.5

# Environment variables:
ENV GOOGLE_AUTH_DOMAIN ''
ENV SESSION_SECRET ''
ENV OAUTH_ID ''
ENV OAUTH_SECRET ''
ENV DB_ADAPTER ''
ENV DB_HOSTNAME ''
ENV DB_PORT 5432
ENV DB_USERNAME ''
ENV DB_PASSWORD ''
ENV DB_NAME ''
ENV READ_DATABASES ''
ENV MISC_DEFAULT false
ENV MISC_DBLISTMATCH false

# Rubygems and bundler
RUN gem update --system --no-ri --no-rdoc
RUN gem install bundler --no-ri --no-rdoc

# python-software-properties is required for add-apt-repository.
RUN useradd asq
RUN mkdir /home/asq
ADD . /home/asq
RUN chown -R asq: /home/asq

WORKDIR /home/asq

RUN su asq -c 'bundle install --deployment'
CMD su asq -c /home/asq/docker_runner.rb

EXPOSE 3000
