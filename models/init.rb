Config = YAML::load(File.open(File.absolute_path('./config.yml')))

DB = Sequel.connect(
          :adapter => 'mysql2',
          :host => Config['db']['host'],
          :user => Config['db']['user'],
          :password => Config['db']['pass'],
          :database => Config['db']['name']
      )

listdbs = DB['SHOW DATABASES']
notWantedDbs = ['information_schema', 'mysql']
wantedDbs = []

listdbs.each do |db|
    unless notWantedDbs.include?db[:Database]
        wantedDbs.push db
    end
end

ListDBs = wantedDbs