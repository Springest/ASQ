#! /usr/bin/env ruby

def get_env_or_fail(name)
  if ENV.has_key?(name)
    ENV[name]
  else
    $stderr.puts "Missing variable: #{name}"
    exit 1
  end
end

File.open("/app/config.yml", "w") do |config|
  config.puts "database:"
  config.puts "  adapter: #{get_env_or_fail("DB_ADAPTER")}"
  config.puts "  host: #{get_env_or_fail("DB_HOSTNAME")}"
  config.puts "  port: #{get_env_or_fail("DB_PORT")}"
  config.puts "  user: #{get_env_or_fail("DB_USERNAME")}"
  config.puts "  password: #{get_env_or_fail("DB_PASSWORD")}"
  config.puts "  database: #{get_env_or_fail("DB_NAME")}"

  config.puts "read_databases:"

  read_databases = get_env_or_fail("READ_DATABASES").split(/\s*,\s*/)

  read_databases.each do |read_database|
    read_database = read_database.gsub(/\s/, '')
    config.puts "  - #{read_database}"
  end

  config.puts "misc:"
  config.puts "  defaultDb: #{get_env_or_fail("MISC_DEFAULT")}"
  config.puts "  dblistMatch: #{get_env_or_fail("MISC_DBLISTMATCH")}"
end

Dir.chdir("/app")
exec("/usr/bin/env bundle exec puma -p 3000")
