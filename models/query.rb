class Query < Sequel::Model
  def results(params, limit = 100)
    # backwards compatible for now....
    result = self

    pattern = /(\[(DATE|INT|FLOAT|STRING):(.+?)(;.+?)?\])/

    if result
      result[:query] = HTMLEntities.new.decode(result[:query])
      query = {
        'id' => @id,
        'name' => result[:name],
        'query' => result[:query]
      }

      queryArgs = query['query'].scan(pattern)

      if queryArgs.empty?
        queryToExecute = query['query']
      else
        queryArgs.each do |arg|
          if params['arg-' + arg[2]].nil?
            default = self.class.getArgParam(arg[3], 'default')

            if default.nil?
              return { :query => query, :args => queryArgs }
            else
              params['arg-' + arg[2]] = default
            end
          end
        end

        queryToExecute = query['query'].gsub(pattern) { |match|
          match = match.scan(pattern)
          CGI::unescape(params['arg-' + match[0][2]])
        }
      end

      toReturn = []

      results = second_db(params[:db])[queryToExecute]

      query['totalRows'] = results.count

      unless (params[:sortColumn].nil?)
        params[:sortColumn] = params[:sortColumn].split('?').first
      end

      if !params[:sortColumn].nil? && params[:sortColumn] != 'null'
        if params[:sortDir] == 'desc'
          results = results.limit(limit, params[:offset].to_i * limit).reverse_order(params[:sortColumn].to_sym)
        else
          results = results.limit(limit, params[:offset].to_i * limit).order(params[:sortColumn].to_sym)
        end
      else
        results = results.limit(limit, params[:offset].to_i * limit)
      end

      results.each do |results|
        toReturn.push(results)
      end

      if queryArgs.empty?
        { :query => query, :results => toReturn }
      else
        { :query => query, :results => toReturn, :args => queryArgs }
      end
    else
      { 'success' => false }
    end
  end

  def self.getArgParam(haystack, needle)
    result = haystack.match('(^|,|;)' + needle + '=(.+?)(,|$)') unless haystack.nil?
    result = result[2] unless result.nil?
    result
  end

  def second_db database_name
    config = Config['database'].merge( 'database' => database_name )
    Sequel.connect( config )
  end

  def self.autosuggest(db, table, column, query)
    toReturn = []

    results = second_db(db)[table.to_sym].filter(column.to_sym.ilike('%' + query + '%')).limit(14)

    results.each do |results|
      toReturn.push(results[column.to_sym])
    end

    toReturn
  end
end