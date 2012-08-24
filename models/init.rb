Config = YAML::load_file("#{settings.root}/config.yml")
DB = Sequel.connect(Config['database'])