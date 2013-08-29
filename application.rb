require 'yaml'

class Application < Sinatra::Base
  set :root, File.dirname(__FILE__)
  set :views, settings.root + '/templates'
  set :public_folder, settings.root + '/public'
  set :config, YAML::load_file("#{settings.root}/config.yml")

  configure do
    set :dump_errors, true
    set :haml, { :ugly => false, :attr_wrapper => '"', :format => :html5 }
    set :clean_trace, true
    set :environment, :development

    require_relative 'models/init'
    require_relative 'models/query'
  end

  use Rack::Auth::Basic, 'Login to use ASQ.' do |username, password|
    [username, password] == [config['login']['user'], config['login']['pass']]
  end

  post '/add' do
    query_params = legacy_convert(params)
    query = Query.new(query_params).save

    # TODO: It would be better to return a hint which attribute is returned
    # For now we keep the old stuff
    # {success: {id: query.id}}.to_json
    {success: query.id}.to_json
  end

  put '/edit/:id' do
    query_params = legacy_convert(params)
    query = Query[params[:id]].update query_params

    # TODO: It would be better to return a hint which attribute is returned
    # For now we keep the old stuff
    # {success: {id: query.id}}.to_json
    {success: query.id}.to_json
  end

  delete '/query/:id' do
    query = Query[params[:id]]
    if query
      query.delete
      {success: query.id}.to_json
    else
      {error: query.id}.to_json
    end
  end

  get '/query/:id' do
    query = Query[params[:id]]
    query.values.to_json
  end

  post '/results' do
    query = Query[params[:id]]
    results = query.results(params)
    if results[:success]
      status 200
      body results.to_json
    else
      status 500
      body results[:message]
    end
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
      @queries = Query.where(:active => 'true').order(:name).all
      @dbs = all_databases
      haml :index
    end
  end

  ['/export/csv/:db/:query', '/export/csv/:db/:query/:sortColumn', '/export/csv/:db/:query/:sortColumn/desc'].each do |path|
    get path do
      headers 'Content-Type' => 'text/csv',
        'Content-Disposition' => 'attachment; filename="export.csv"'

      query = Query[params[:query]]
      results = query.results(params, 1_000_000)

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

  helpers do
    def all_databases
      case Config['database']['adapter']
      when 'mysql2'
        all_dbs = DB['SHOW DATABASES'].to_a.map{|row| row[:Database]}
      when 'postgres'
        all_dbs = DB['SELECT datname AS database FROM pg_database'].to_a.map{|row| row[:database]}
      when 'sqlite'
        all_dbs = DB['PRAGMA database_list'].to_a.map{|row| row[:name]}
      end

      filter_databases all_dbs
    end

    def filter_databases list
      return list unless database_matcher

      matcher = Regexp.new(database_matcher)
      list.select{|database| matcher.match(database) }
    end

    def database_matcher
      settings.config['misc']['dblistMatch']
    end

    def legacy_convert params
      {
        name: params['edit-name'],
        query: params['edit-query'],
        active: true
      }
    end
  end
end
