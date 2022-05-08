module MealHelper
  def lunch_late_plates
    late_plates = weekly_lunch_meals_by_member("LL")
    
    late_plates = late_plates.map do |member_id|
      Member.find_by(member_id: member_id)
    end.uniq.sort_by{|m| m.last}
  end

  def dinner_late_plates
    late_plates = weekly_dinner_meals_by_member("DL")

    late_plates = late_plates.map do |member_id|
      Member.find_by(member_id: member_id)
    end.uniq.sort_by{|m| m.last}
  end

  def meal_count(date)
    date = date.to_date
    meals = {}
    meals["LI"] = weekly_lunch_meals_by_member("LI", date).count
    meals["LGuest"] = lunch_guest_meals(date)
    meals["LE"] = weekly_lunch_meals_by_member("LE", date).count
    meals["LL"] = weekly_lunch_meals_by_member("LL", date).count
    meals["LTotal"] = meals["LI"] + meals["LGuest"] + meals["LE"] + meals["LL"]

    meals["DI"] = weekly_dinner_meals_by_member("DI", date).count
    meals["DGuest"] = dinner_guest_meals(date)
    meals["DE"] = weekly_dinner_meals_by_member("DE", date).count
    meals["DL"] = weekly_dinner_meals_by_member("DL", date).count
    meals["DTotal"] = meals["DI"] + meals["DGuest"] + meals["DE"] + meals["DL"]
    meals
  end

  def crew_meals (in_count, guest_count, crew_count)
    if in_count + guest_count - crew_count > 0
      in_count + guest_count - crew_count
    else
      0
    end
  end

  def crew_tables (count)
    (count/@crew_numbers.table_capacity.to_f).ceil
  end

  def crew_tables_remainder (count)
    (@crew_numbers.table_capacity - (count % @crew_numbers.table_capacity)) % @crew_numbers.table_capacity
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
      Meal.where(date: date, member_id: member_id).present?
    end

    meals << Meal.where(date: date, lunch: meal).pluck(:member_id)
    meals.flatten!.reject(&:blank?)
  end

  def weekly_dinner_meals_by_member(meal, date=Date.today)
    meals =
    case wday = date.wday()
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
      Meal.where(date: date, member_id: member_id).present?
    end

    meals << Meal.where(date: date, dinner: meal).pluck(:member_id)
    meals.flatten!.reject(&:blank?)
  end

  def lunch_guest_meals(date)
    meals = Meal.where(date: date).where("lunch_qty > 1")
    count = 0;
    meals.each do |meal|
      count += meal.lunch_qty - 1
    end
    count
  end

  def dinner_guest_meals(date)
    meals = Meal.where(date: date).where("dinner_qty > 1")
    count = 0;
    meals.each do |meal|
      count += meal.dinner_qty - 1
    end
    count
  end

  def meal_count_by_member(start_date, end_date)
    meals = Meal.where(date: start_date..end_date)
    meal_members = meals.pluck(:member_id)

    members = {}

    meal_members.each do |member_id|
      members[member_id] = {}
      members[member_id]["lunch"] = 0
      members[member_id]["dinner"] = 0
      members[member_id]["wed_dinner"] = 0
    end

    meals.each do |meal|
      member = Member.find_by(member_id: meal.member_id)
      lunch = 0
      dinner = 0
      wed_dinner = 0
      if member.in_house?
        lunch += meal.lunch_qty - 1
        dinner += meal.dinner_qty - 1
      else
        if meal.lunch != "LO"
          lunch += meal.lunch_qty
        end
        if meal.dinner != "DO" && meal.date.wday() != 3 #Wednesday Dinner
          dinner += meal.dinner_qty
        elsif meal.dinner != "DO" && meal.date.wday() == 3 #Wednesday Dinner
          wed_dinner += meal.dinner_qty
        end
      end
      members[member.member_id]["lunch"] += lunch
      members[member.member_id]["dinner"] += dinner
      members[member.member_id]["wed_dinner"] += wed_dinner
    end
    members = members.reject{|m, v| v["lunch"] == 0 && v["dinner"] == 0}

    new_members = {}
    members = members.map do |member_id, v|
      new_members[Member.find_by(member_id: member_id)] = v
    end
    new_members.sort_by{|m, v| m.last}
  end

  def meal_count_for_member(start_date, end_date, member_id)
    if member_id.present?
      meals = {}
      start_date = start_date.to_date
      end_date = end_date.to_date
      while start_date <= end_date
        if start_date.on_weekday?
          meals[start_date] = {}
          meals[start_date]["lunch"] = "L?"
          meals[start_date]["lunch_qty"] = "1"
          meals[start_date]["dinner"] = "D?"
          meals[start_date]["dinner_qty"] = "1"
          meal = Meal.where(date: start_date, member_id: member_id)
          if meal.blank?
            case start_date.wday
            when 1 #Monday
              meals[start_date]["lunch"] = WeeklyMeal.find_by(member_id: member_id).mon_lunch
              meals[start_date]["dinner"] = WeeklyMeal.find_by(member_id: member_id).mon_dinner
            when 2 #Tueday
              meals[start_date]["lunch"] = WeeklyMeal.find_by(member_id: member_id).tue_lunch
              meals[start_date]["dinner"] = WeeklyMeal.find_by(member_id: member_id).tue_dinner
            when 3 #Wednesday
              meals[start_date]["lunch"] = WeeklyMeal.find_by(member_id: member_id).wed_lunch
              meals[start_date]["dinner"] = WeeklyMeal.find_by(member_id: member_id).wed_dinner
            when 4 #Thursday
              meals[start_date]["lunch"] = WeeklyMeal.find_by(member_id: member_id).thu_lunch
              meals[start_date]["dinner"] = WeeklyMeal.find_by(member_id: member_id).thu_dinner
            when 5 #Friday
              meals[start_date]["lunch"] = WeeklyMeal.find_by(member_id: member_id).fri_lunch
              meals[start_date]["dinner"] = WeeklyMeal.find_by(member_id: member_id).fri_dinner
            end
          else
            meal = meal.first!
            meals[start_date]["lunch"] = meal.lunch
            meals[start_date]["lunch_qty"] = meal.lunch_qty
            meals[start_date]["dinner"] = meal.dinner
            meals[start_date]["dinner_qty"] = meal.dinner_qty
          end

          if meals[start_date]["lunch"] == "LO"
            meals[start_date]["lunch_qty"] = "0"
          end
          if meals[start_date]["dinner"] == "DO"
            meals[start_date]["dinner_qty"] = "0"
          end
        end
        start_date = start_date + 1.day
      end
      meals
    end
  end

  def members_for_meal_type(date, meal_type)
    date = date.to_date
    member_ids =
    if meal_type[1] != "G" #Guest
      if meal_type[0] == "L" #Lunch
        weekly_lunch_meals_by_member(meal_type, date)
      else
        weekly_dinner_meals_by_member(meal_type, date)
      end
    else
      if meal_type[0] == "L" #Lunch
        Meal.where(date: date).where("lunch_qty > 1").pluck(:member_id)
      else
        Meal.where(date: date).where("dinner_qty > 1").pluck(:member_id)
      end
    end

    members = member_ids.map do |member_id|
      Member.find_by(member_id: member_id)
    end
    members.sort_by{|m| m.last}
  end

  def full_meal_name(code)
    case code[1]
    when "I"
      "In"
    when "O"
      "Out"
    when "E"
      "Early"
    when "L"
      "Late"
    else
      "?"
    end
  end
end