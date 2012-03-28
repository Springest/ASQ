Config = YAML::load(File.open(File.absolute_path('./config.yml')))

DB = Sequel.connect(
          :adapter => 'mysql2',
          :host => Config['db']['host'],
          :user => Config['db']['user'],
          :password => Config['db']['pass'],
          :database => Config['db']['name']
      )

ListDBs = DB['SHOW DATABASES']