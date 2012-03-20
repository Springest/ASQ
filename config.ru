require 'rubygems'
require 'bundler'

Bundler.require

root = ::File.dirname(__FILE__)

require './application'
run Application
