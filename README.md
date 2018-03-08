ASQ
===

Dare to ASQ!

What is it?
-----------

ASQ is a simple yet powerful query tool. It's self hosted, and works with MySQL 5.5+, PostgreSQL 9+ and SQLite 3+. It's ideal to use for your business intelligence: run complex queries and export them to CSV (or maybe GDocs in the future). Once a query is stored, anyone in the team can run it, to see what the current results are.

License
-------

ASQ is released under GPL v3 License, see the file LICENSE.

Install
-------

* Install the MySQL Ruby Gem;
* Clone repository with `git clone git@github.com:Springest/ASQ.git asq`;
* Open folder with `cd asq`;
* Create a copy of `Gemfile.EXAMPLE` and name it `Gemfile`. Uncomment the DB adapter you want to use.
* Install bundles with `bundle install`;
* Create a database `asq_queries`;
* Import the needed `install_YOUR_DB.sql` where `YOUR_DB` is either `mysql`, `postgresql` or `sqlite`;
* Edit `config.EXAMPLE.yml` to desired settings (be sure to rename for example `mysql` to `database` to use MySQL) and save it as `config.yml`;
* Run with `bundle exec rackup`;
* Open `http://localhost:9292` in your browser;
* Log in and query away!

Running on Docker
-----------------

A docker-compose.yml is included for convenience.

* `cp .env.example .env`
* Update `.env` to fit your environment.
* `docker-compose -f docker-compose.yml up`

Warning!
--------

The person who is able to access ASQ, can run any query he or she wants. It's strongly adviced to use a separate MySQL user with only `SELECT` query permissions. Otherwise a simple `DROP DATABASE foo` can ruin your site/app.

At Springest we run ASQ on a mirror with slight delay of the working database, to not overload the working database with heavy queries.

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
[STRING:SubjectName;autosuggest=subjects.name] for an autosuggest served from table 'subject' column 'name'.
```

* Note that for comparison with the `=` you need to wrap the column name in the `DATE(columnname)` or one of the other date functions in MySQL <http://dev.mysql.com/doc/refman/5.5/en/date-and-time-functions.html>, PostgreSQL <http://www.postgresql.org/docs/8.0/static/functions-datetime.html> or SQLite <http://www.sqlite.org/lang_datefunc.html>.
* The names of the variables can't contain spaces.
* If you use strings in a comparison, wrap the code around quotes, otherwise it does not know that it is dealing with strings.

Contributions by
----------------
* [Mark Mulder](https://github.com/bittersweet)
* [Jan-Willem van der Meer](https://github.com/jewilmeer)

Thanks!

TODO
----
* Login to Google Apps and export to Google Docs;
