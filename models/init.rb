Config = YAML::load_file("config.yml")
DB = Sequel.connect(Config['database'])
