require 'rubygems'
require 'bundler'
require 'csv'

Bundler.require

root = ::File.dirname(__FILE__)
Root = root

require './application'
run Application
