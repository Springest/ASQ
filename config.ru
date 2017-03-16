require 'rubygems'
require 'bundler'
require 'csv'

Bundler.require

root = ::File.dirname(__FILE__)
Root = root

require File.join(root, 'application')
run Application
