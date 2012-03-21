require 'rubygems' if RUBY_VERSION < '1.9'
require 'sinatra'
require 'sinatra/sequel'
require 'mysql2'
require './models/init'
require './models/queryrow'
require './models/querytable'
require 'json'


class Application < Sinatra::Base
    set :root, File.dirname(__FILE__)
    set :views, settings.root + '/templates'
    set :public_folder, settings.root + '/public'


    configure do
        set :dump_errors, true
        set :haml, { :ugly => false, :attr_wrapper => '"' }
        set :clean_trace, true
        set :environment, :development
    end


    use Rack::Auth::Basic, "Restricted Area" do |username, password|
        [username, password] == ['admin', 'admin']
    end


    post '/add' do
        insertedRow = QueryRow.new(params)
        returnValue = insertedRow.save

        if returnValue[:success] && !params.has_key?('ajax')
            redirect sprintf('/#query=%s', returnValue[/[0-9]+/])
        else
            returnValue.to_json
        end
    end


    delete '/query/:id' do
        row = QueryRow.new(params[:id].to_i)
        row.delete.to_json
    end


    get '/query/:id' do
        row = QueryRow.new(params[:id].to_i)
        result = row.get.to_json
    end


    post '/results' do
        row = QueryRow.new(params[:id].to_i)

        row.results(params).to_json
    end


    get '/styles/screen.css' do
        content_type 'text/css', :charset => 'utf-8'
        sass :screen, :style => :expanded
    end


    ['/:db/:query', '/:db/:query/:order', '/:db/:query/:order/desc', '/'].each do |path|
        get path do
            @queries = QueryTable.all
            @dbs = ListDBs
            haml :index
        end
    end
end