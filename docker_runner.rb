#! /usr/bin/env ruby

def get_env_or_fail(name)
  if ENV.has_key?(name)
    ENV[name]
  else
    $stderr.puts "Missing variable: #{name}"
    exit 1
  end
end

File.open("/home/asq/config.yml", "w") do |config|
  config.puts "database:"
  config.puts "  adapter: #{get_env_or_fail("DB_ADAPTER")}"
  config.puts "  host: #{get_env_or_fail("DB_HOST")}"
  config.puts "  user: #{get_env_or_fail("DB_USER")}"
  config.puts "  password: #{get_env_or_fail("DB_PASSWORD")}"
  config.puts "  database: #{get_env_or_fail("DB_DATABASE")}"
  config.puts "login:"
  config.puts "  user: #{get_env_or_fail("LOGIN_USER")}"
  config.puts "  pass: #{get_env_or_fail("LOGIN_PASSWORD")}"
  config.puts "misc:"
  config.puts "  defaultDb: #{get_env_or_fail("MISC_DEFAULT")}"
  config.puts "  dblistMatch: #{get_env_or_fail("MISC_DBLISTMATCH")}"
end

Dir.chdir("/home/asq")
exec("/usr/bin/env bundle exec thin start -p 3000")
