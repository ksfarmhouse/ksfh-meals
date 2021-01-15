desc "Transfers Weekly Meals to Meals"
task :transfer_weekly_meals => :environment do
  day = Date.today.wday()  
  if day > 0 && day < 6 #weekday
    WeeklyMeal.all.each do |wm|
      #make sure it doesn't already exist
      if Meal.where(member_id: wm.member_id, date: Date.today).blank?
        meal = Meal.new(member_id: wm.member_id, date: Date.today)
        if day == 1 #Monday
          meal.lunch = wm.mon_lunch
          meal.dinner = wm.mon_dinner
        elsif day == 2 #Tuesday
          meal.lunch = wm.tue_lunch
          meal.dinner = wm.tue_dinner
        elsif day == 3 #Wednesday
          meal.lunch = wm.wed_lunch
          meal.dinner = wm.wed_dinner
        elsif day == 4 #Thursday
          meal.lunch = wm.thu_lunch
          meal.dinner = wm.thu_dinner
        elsif day == 5 #Friday
          meal.lunch = wm.fri_lunch
          meal.dinner = wm.fri_dinner
        end
        meal.save!
      end
    end
  end
end