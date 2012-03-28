require 'rubygems'
require 'bundler'

Bundler.require

root = ::File.dirname(__FILE__)
Root = root

require './application'
run Application
