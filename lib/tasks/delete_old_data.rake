desc "Deletes Past Menu Items and Deletes Meals Every Semester"
task :delete_old_data => :environment do
  today = Date.today

  Menu.where("date < ?", today).destroy_all

  # if January 1 have the new members activated
  if (today.month == 1 && today.day == 1)
    Member.where(status: "N").update_all(status: "I")
  end

  # if January 1 or August 1
  if (today.month == 1 && today.day == 1) || (today.month == 8 && today.day == 1)
    Meal.all.destroy_all

    #reset meals
    Member.where(status: "I").or(Member.where(status: "N")).map do |member|
      weekly_meal = WeeklyMeal.find_by(member_id: member.member_id).update(WeeklyMeal.in_meals)
    end

    Member.where(status: "O").or(Member.where(status: "A")).map do |member|
      weekly_meal = WeeklyMeal.find_by(member_id: member.member_id).update(WeeklyMeal.out_meals)
    end
  end
end