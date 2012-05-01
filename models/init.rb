Config = YAML::load(File.open(File.absolute_path('./config.yml')))

DB = Sequel.connect(
        :adapter => 'mysql2',
        :host => Config['db']['host'],
        :user => Config['db']['user'],
        :password => Config['db']['pass'],
        :database => Config['db']['name'],
        :timeout => 60
    )

ListDBs = DB['SHOW DATABASES'].to_a.delete_if{ |db| db[:Database].match(/_www/).nil? }