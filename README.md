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

Arguments in queries
--------------------
* Open the add/edit a query dialog.
* On the place where you want to use an argument, insert one of the following things:

```
[INT:Number]
[FLOAT:Another_number;default=5.7]
[STRING:Name_of_the_string;default=hallo] for a string with default value 'hallo' (without quotes).
[DATE:Some_date]
[DATE:Month;type=month] for a month (will be padded like this if the input is `2012-05-13`): `2012-05-01`
[DATE:Some_year;type=year,compact=true] for a year that will not be padded on the right.
```

* Note that for comparison with the `=` you need to wrap the column name in the `DATE(columnname)` or one of the other date functions in MySQL. <http://dev.mysql.com/doc/refman/5.5/en/date-and-time-functions.html>
* The names of the variables can't contain spaces.
* If you use strings in a comparison, wrap the code around quotes, otherwise MySQL does not know that it is dealing with strings.

TODO
----

* Export to Google Docs;