ASQ: Ask with a query
=====================

Install
-------

* Install the MySQL Ruby Gem;
* Clone repository;
* Install bundles with `bundle install`;
* Open `install.sql` and execute it in a MySQL DB, via for example phpmyadmin or Seuql Pro;
* Update DB settings in `models/init.rb` and `models/queryrow.rb`;
* Update login details in `application.rb`
* Run with `bundle exec shotgun`;
* Open `http://localhost:9393` in your browser;
* Log in and query away!

TODO
----

* Nice config files;
* Export to Google Docs, xls, csv etc;
* Nicer errors.