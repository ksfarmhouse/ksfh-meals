desc "Transfers Weekly Meals to Meals"
task :transfer_weekly_meals => :environment do
  day = Date.today.wday()  
  if day > 0 && day < 6 #weekday
    WeeklyMeal.all.each do |wm|
      #only do it for OOH and Alum
      unless (Member.find_by(member_id: wm.member_id).in_house?)
        #make sure it doesn't already exist
        if Meal.where(member_id: wm.member_id, date: Date.today).blank?
          meal = Meal.new(member_id: wm.member_id, date: Date.today)
          if day == 1 #Monday
            if wm.mon_lunch == "LO" && wm.mon_dinner == "DO"
              meal.delete
            else
              meal.lunch = wm.mon_lunch
              meal.dinner = wm.mon_dinner
              meal.save!
            end
          elsif day == 2 #Tuesday
            if wm.tue_lunch == "LO" && wm.tue_dinner == "DO"
              meal.delete
            else
              meal.lunch = wm.tue_lunch
              meal.dinner = wm.tue_dinner
              meal.save!
            end
          elsif day == 3 #Wednesday
            if wm.wed_lunch == "LO" && wm.wed_dinner == "DO"
              meal.delete
            else
              meal.lunch = wm.wed_lunch
              meal.dinner = wm.wed_dinner
              meal.save!
            end
          elsif day == 4 #Thursday
            if wm.thu_lunch == "LO" && wm.thu_dinner == "DO"
              meal.delete
            else
              meal.lunch = wm.thu_lunch
              meal.dinner = wm.thu_dinner
              meal.save!
            end
          elsif day == 5 #Friday
            if wm.fri_lunch == "LO" && wm.fri_dinner == "DO"
              meal.delete
            else
              meal.lunch = wm.fri_lunch
              meal.dinner = wm.fri_dinner
              meal.save!
            end
          end
        end
      end
    end
  end
end