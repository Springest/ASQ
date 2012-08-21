class QueryTable
  def self.all
    DB[:queries].where(:active => 'true').order(:name)
  end
end
