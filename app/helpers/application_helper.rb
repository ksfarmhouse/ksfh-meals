module ApplicationHelper
  def lunch_late_plates
    late_plates = weekly_lunch_meals_by_member("LL")
    
    late_plates = late_plates.map do |member_id|
      Member.find_by(member_id: member_id)
    end.uniq
  end

  def dinner_late_plates
    late_plates = weekly_dinner_meals_by_member("DL")

    late_plates = late_plates.map do |member_id|
      Member.find_by(member_id: member_id)
    end.uniq
  end

  def meal_count(date=Date.today)
    meals = {}
    meals["LI"] = weekly_lunch_meals_by_member("LI", date).count
    meals["LE"] = weekly_lunch_meals_by_member("LE", date).count
    meals["LL"] = weekly_lunch_meals_by_member("LL", date).count

    meals["DI"] = weekly_dinner_meals_by_member("DI", date).count
    meals["DE"] = weekly_dinner_meals_by_member("DE", date).count
    meals["DL"] = weekly_dinner_meals_by_member("DL", date).count
    meals
  end

  def weekly_lunch_meals_by_member(meal, date=Date.today)
    meals =
    case date.wday()
      when 1 #Monday
        WeeklyMeal.where(mon_lunch: meal).pluck(:member_id)
      when 2 #Tueday
        WeeklyMeal.where(tue_lunch: meal).pluck(:member_id)
      when 3 #Wednesday
        WeeklyMeal.where(wed_lunch: meal).pluck(:member_id)
      when 4 #Thursday
        WeeklyMeal.where(thu_lunch: meal).pluck(:member_id)
      when 5 #Friday
        WeeklyMeal.where(fri_lunch: meal).pluck(:member_id)
      else
        []
    end

    # reject if there is a meal made for it
    meals.reject! do |member_id|
      Meal.where(date: Date.today, member_id: member_id).present?
    end

    meals << Meal.where(date: Date.today, lunch: meal).pluck(:member_id)
    meals.flatten!.reject(&:blank?)
  end

  def weekly_dinner_meals_by_member(meal, date=Date.today)
    meals =
    case wday = Date.today().wday()
      when 1 #Monday
        WeeklyMeal.where(mon_dinner: meal).pluck(:member_id)
      when 2 #Tueday
        WeeklyMeal.where(tue_dinner: meal).pluck(:member_id)
      when 3 #Wednesday
        WeeklyMeal.where(wed_dinner: meal).pluck(:member_id)
      when 4 #Thursday
        WeeklyMeal.where(thu_dinner: meal).pluck(:member_id)
      when 5 #Friday
        WeeklyMeal.where(fri_dinner: meal).pluck(:member_id)
      else
        []
    end
    # reject if there is a meal made for it
    meals.reject! do |member_id|
      Meal.where(date: Date.today, member_id: member_id).present?
    end

    meals << Meal.where(date: Date.today, dinner: meal).pluck(:member_id)
    meals.flatten!.reject(&:blank?)
  end
end  
