class QueryRow
    def initialize(params)
        if (params.kind_of?Numeric)
            @id = params
            @error = false
        elsif (params.kind_of?Hash)
            if (params.has_key?('edit-id'))
                @id = params['edit-id'].to_i
            else
                @id = nil
            end

            if (params.has_key?('edit-name') && params.has_key?('edit-query') && params['edit-name'].length != 0 && params['edit-query'].length != 0)
                @name = params['edit-name']
                @query = params['edit-query']
                @error = false
            else
                @error = true
            end
        else
            @error = true
        end
    end


    def save
        @query = HTMLEntities.new.encode(@query)
        if (@error)
            { 'success' => false }
        elsif (@id.nil?)
            @id = DB[:queries].insert(:name => @name, :query => @query)
            { 'success' => @id }
        else
            DB[:queries].where(:id => @id).update(:name => @name, :query => @query)
            
            { 'success' => @id }
        end
    end


    def delete
        if (@id != nil)
            success = DB[:queries].where(:id => @id).update(:active => 'false')

            if (success == 1)
                { 'success' => @id }
            else
                { 'success' => false }
            end
        else
            { 'success' => false }
        end
    end


    def get
        result = DB[:queries].where(:id => @id, :active => 'true').first

        if (result)
            result[:query] = HTMLEntities.new.decode(result[:query])
            {
                'id' => @id,
                'name' => result[:name],
                'query' => result[:query]
            }
        else
            { 'success' => false }
        end
    end


    def results(params, limit = 100)
        result = DB[:queries].where(:id => @id, :active => 'true').first

        if (result)
            result[:query] = HTMLEntities.new.decode(result[:query])
            query = {
                'id' => @id,
                'name' => result[:name],
                'query' => result[:query]
            }

            seconddb = Sequel.connect(
                :adapter => 'mysql2',
                :host => Config['db']['host'],
                :user => Config['db']['user'],
                :password => Config['db']['pass'],
                :database => params[:db],
                :timeout => 60
            )

            toReturn = []

            results = seconddb[result[:query]]

            query['totalRows'] = results.count

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

            { :query => query, :results => toReturn }
        else
            { 'success' => false }
        end
    end
end