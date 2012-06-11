Config = YAML::load(File.open(File.absolute_path('./config.yml')))

DB = Sequel.connect(
        :adapter => 'mysql2',
        :host => Config['db']['host'],
        :user => Config['db']['user'],
        :password => Config['db']['pass'],
        :database => Config['db']['name'],
        :timeout => 30,
        :reconnect => true
    )

ListDBs = DB['SHOW DATABASES'].to_a.delete_if {
    |db|
    if Config['misc']['dblistMatch']
        db[:Database].match(
            Regexp.new(
                Config['misc']['dblistMatch']
            )
        ).nil?
    else 
        false
    end
}