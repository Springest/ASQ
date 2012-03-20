class QueryTable
    def self.all
        DB[:queries].where(:active => 'true')
    end


    def self.find(search)
        results = DB['SELECT * FROM `queries` WHERE `active`="true" AND MATCH (`name`, `description`, `query`) AGAINST (? IN BOOLEAN MODE) LIMIT 15', search]

        toReturn = []

        results.each{ |results|
            toReturn.push(results)
        }

        toReturn
    end
end