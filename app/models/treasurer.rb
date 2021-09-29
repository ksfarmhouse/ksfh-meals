class Treasurer
  include ActiveModel::Model
  attr_accessor :start_date, :end_date

  def to_csv
    meal_count = meal_count_by_member(self.start_date, self.end_date)

    CSV.generate(headers: true) do |csv|
      csv << ["Treasurer Export"]
      csv << ["From #{self.start_date.to_date.strftime("%B %-d, %Y")} to #{self.end_date.to_date.strftime("%B %-d, %Y")}"]
      csv << []

      csv << %w{Member Lunches Dinners Wed\ Dinners}

      meal_count.each do |member, meals|
        csv << [member.full_name, meals["lunch"], meals["dinner"], meals["wed_dinner"]]
      end
    end
  end

  def meal_count_by_member(start_date, end_date)
    ApplicationController.helpers.meal_count_by_member(start_date, end_date)
  end
end
