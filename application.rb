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
    require_relative 'models/queryrow'
    require_relative 'models/querytable'
  end

  use Rack::Auth::Basic, 'Login to use ASQ.' do |username, password|
    [username, password] == [config['login']['user'], config['login']['pass']]
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
      @dbs = all_databases
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
  end
end
