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

            if (params.has_key?('edit-name') && params.has_key?('edit-description') && params.has_key?('edit-query') && params['edit-name'].length != 0 && params['edit-description'].length != 0 && params['edit-query'].length != 0)
                @name = params['edit-name']
                @description = params['edit-description']
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
        if (@error)
            { 'success' => false }
        elsif (@id == nil)
            @id = DB[:queries].insert(:name => @name, :description => @description, :query => @query)
            { 'success' => @id }
        else
            DB[:queries].where(:id => @id).update(:name => @name,:description => @description, :query => @query)
            p @id
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
            {
                'id' => @id,
                'name' => result[:name],
                'description' => result[:description],
                'query' => result[:query]
            }
        else
            { 'success' => false }
        end
    end


    def results(params)
        result = DB[:queries].where(:id => @id, :active => 'true').first

        if (result)
            query = {
                'id' => @id,
                'name' => result[:name],
                'description' => result[:description],
                'query' => result[:query]
            }

            seconddb = Sequel.connect(
                :adapter => 'mysql2',
                :host => 'localhost',
                :user => 'root',
                :password => 'root',
                :database => params[:db]
            )

            toReturn = []

            results = seconddb[result[:query]]

            query['totalRows'] = results.count

            if (params[:sortColumn] != 'null')
                if (params[:sortDir] == 'desc')
                    results = results.limit(100, params[:offset].to_i * 100).reverse_order(params[:sortColumn].to_sym)
                else
                    results = results.limit(100, params[:offset].to_i * 100).order(params[:sortColumn].to_sym)
                end
            else
                results = results.limit(100, params[:offset].to_i * 100)
            end

            results.each{ |results|
                toReturn.push(results)
            }

            { :query => query, :results => toReturn }
        else
            { 'success' => false }
        end
    end
end