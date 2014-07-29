ENV["GOOGLE_AUTH_DOMAIN"] ||= "<your google apps domain, e.g. springest.com>"
ENV["SESSION_SECRET"]     ||= "CHANGE ME!"
ENV["OAUTH_ID"]           ||= "<your google oauth id>"
ENV["OAUTH_SECRET"]       ||= "<your google oauth secret>"
require 'yaml'
require 'oauth2'
require 'omniauth-oauth2'
require 'omniauth-google-oauth2'

class Application < Sinatra::Base
  use Rack::Session::Cookie, :secret => ENV["SESSION_SECRET"]
  use OmniAuth::Builder do
    provider :google_oauth2, ENV["OAUTH_ID"], ENV["OAUTH_SECRET"], {
      :scope => 'email,profile'
    }
  end

  OmniAuth.config.on_failure = Proc.new { |env|
    OmniAuth::FailureEndpoint.new(env).redirect_to_failure
  }

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

  before do
    puts ENV["OAUTH_ID"]
    puts ENV["OAUTH_SECRET"]
    authenticate! unless request.path == "/auth/google_oauth2/callback"
  end

  # Callback URL used when the authentication is done
  get '/auth/google_oauth2/callback' do
    puts "In callback"
    auth_details = request.env['omniauth.auth']
    puts auth_details.info
    session[:domain] = auth_details.info['email'].split('@').last
    session[:user_info] = auth_details.info
    redirect '/'
  end

  get '/auth/failure' do
    puts params[:message]
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

  private

  def authenticate!
    if session[:domain] != ENV["GOOGLE_AUTH_DOMAIN"]
      puts session[:email]
      puts session[:domain]
      redirect '/auth/google_oauth2'
    end
  end
end
