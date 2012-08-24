Config = YAML::load(File.open(File.absolute_path('./config.yml')))


# Mysql
if Config['db'].has_key? 'mysql'
  dbc = Config['db']['mysql']

  DB = Sequel.connect(
    :adapter => 'mysql2',
    :host => dbc['host'],
    :user => dbc['user'],
    :password => dbc['pass'],
    :database => dbc['name'],
    :timeout => 30,
    :reconnect => true
  )

  dblist = DB['SHOW DATABASES'].to_a

# PostegreSQL
elsif Config['db'].has_key? 'postgresql'
  dbc = Config['db']['postgresql']

  DB = Sequel.connect("postgres://#{ dbc['user'] }@#{ dbc['host']}/#{ dbc['name']}")

  dblist = DB['SELECT datname AS database FROM pg_database'].to_a

  dblist.map! do |dbname|
    dbname[:Database] = dbname[:database]
    dbname.delete :database
    dbname
  end
end



ListDBs = dblist.delete_if do |db|
  if Config['misc']['dblistMatch']
    db[:Database].match(
      Regexp.new(
        Config['misc']['dblistMatch']
      )
    ).nil?
  else
    false
  end
end