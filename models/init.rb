DB = Sequel.connect('mysql2://root:root@localhost/asq_queries');

ListDBs = DB['SHOW DATABASES']