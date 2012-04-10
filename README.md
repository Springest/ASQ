ASQ: Awesome Super Queries
==========================

Or: **AS**k with a **Q**uery.

Install
-------

* Install the MySQL Ruby Gem;
* Clone repository iwth `git clone git@github.com:Springest/ASQ.git asq`;
* Open folder with `cd asq`;
* Install bundles with `bundle install`;
* Open `install.sql` and execute it in a MySQL DB, via for example phpmyadmin or Sequel Pro;
* Edit `config.EXAMPLE.yml` to desired settings and save it as `config.yml`;
* Run with `bundle exec shotgun`;
* Open `http://localhost:9393` in your browser;
* Log in and query away!

Warning!
--------

The person who is able to access ASQ, can run any query he or she wants. It's strongly adviced to use a separate MySQL user with only `SELECT` query permissions. Otherwise a simple `DROP DATABASE foo` can ruin your site/app.

TODO
----

* Export to Google Docs, xls, csv etc;
* Nicer errors.