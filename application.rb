require 'rubygems' if RUBY_VERSION < '1.9'
require 'sinatra'
require 'sinatra/sequel'
require 'mysql2'
require './models/init'
require './models/queryrow'
require './models/querytable'
require 'json'
require 'csv'
require 'yaml'
require 'htmlentities'

class Application < Sinatra::Base
  set :root, File.dirname(__FILE__)
  set :views, settings.root + '/templates'
  set :public_folder, settings.root + '/public'

  configure do
    set :dump_errors, true
    set :haml, { :ugly => false, :attr_wrapper => '"', :format => :html5 }
    set :clean_trace, true
    set :environment, :development
  end

  use Rack::Auth::Basic, 'Login to use ASQ.' do |username, password|
    [username, password] == [Config['login']['user'], Config['login']['pass']]
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

  post '/autosuggestable' do
    results = QueryRow.autosuggest(params[:db], params[:table], params[:column], params[:query])
    {
      :results => results,
      :version => params[:version]
    }.to_json
  end

  ['/:db/:query', '/:db/:query/:order', '/:db/:query/:order/desc', '/'].each do |path|
    get path do
      @queries = QueryTable.all
      @dbs = ListDBs
      haml :index
    end
  end

  ['/export/csv/:db/:query', '/export/csv/:db/:query/:sortColumn', '/export/csv/:db/:query/:sortColumn/desc'].each do |path|
    get path do
      headers 'Content-Type' => 'text/csv',
        'Content-Disposition' => 'attachment; filename="export.csv"'

      row = QueryRow.new(params[:query].to_i)
      results = row.results(params, 1000000)

      csv_string = CSV.generate(:col_sep => ';') do |csv|
        titles = []
        results[:results].each do |value|
          toInsert = []
          value.each do |k, v|
            if titles.is_a?(Array)
              titles.push(k)
            end
            toInsert.push(v)
          end
          if titles.is_a?(Array)
            csv << titles
          end
          csv << toInsert
          titles = false
        end
      end

      csv_string
    end
  end
end
