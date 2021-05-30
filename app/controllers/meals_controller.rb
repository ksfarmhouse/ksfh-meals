class MealsController < ApplicationController
  def index
    start_date = params[:treasurer] && params[:treasurer][:start_date]
    end_date = params[:treasurer] && params[:treasurer][:end_date]
    @treasurer = Treasurer.new(
      start_date: start_date || start_of_semester,
      end_date: end_date || Date.today
    )
  end

  def edit
    @meal = Meal.new()
  end

  def update
    member_id = params[:meal][:member_id]

    respond_to do |format|
      if Member.where(member_id: member_id).blank?
        format.html {redirect_to edit_meals_path, alert: "Unable to Find Member"}
      else
        meal = Meal.where(member_id: member_id, date: params[:meal][:date])
        if meal.blank?
          meal = Meal.new(meal_params)
          if meal.save!
            format.html {redirect_to edit_meals_path, notice: "Meal Saved!"}
          else
            format.html {redirect_to edit_meals_path, alert: "Unable to Save Meal"}
          end
        else
          if meal.update(meal_params)
            format.html {redirect_to edit_meals_path, notice: "Meal Saved!"}
          else
            format.html {redirect_to edit_meals_path, alert: "Unable to Save Meal"}
          end
        end
      end
    end
  end

  def list
    start_date = params[:meal_list] && params[:meal_list][:start_date]
    end_date = params[:meal_list] && params[:meal_list][:end_date]
    member_id = params[:meal_list] && params[:meal_list][:member_id]
    @member = Member.where(member_id: member_id)
    @meal_list = MealList.new(
      start_date: start_date || Date.today,
      end_date: end_date || Date.today,
      member_id: member_id
    )
  end

  def member_list
    date = params[:date] || params[:meal_member_list] && params[:meal_member_list][:date]
    meal_type = params[:meal_type] || params[:meal_member_list] && params[:meal_member_list][:meal_type]
    @meal_member_list = MealMemberList.new(
      date: date || Date.today,
      meal_type: meal_type || "LI"
    )
  end

  def late_plates
  end

  def cook
    date = params[:cook] && params[:cook][:date]
    @cook = Cook.new(date: date || Date.today)
    @crew_numbers = CrewNumber.all.first!
  end

  def reset_meals
    @meals = Meal.new
    params[:admin] = true
  end

  def reset_meals_post
    ih_status = Member.where(status: "I").map do |member|
      weekly_meal = WeeklyMeal.find_by(member_id: member.member_id).update(WeeklyMeal.in_meals)
    end

    ooh_status = Member.where.not(status: "I").map do |member|
      weekly_meal = WeeklyMeal.find_by(member_id: member.member_id).update(WeeklyMeal.out_meals)
    end

    respond_to do |format|
      if ih_status.all?(true) && ooh_status.all?(true)
        format.html {redirect_to reset_meals_path, notice: "Successfully Reset Meals!"}
      else
        format.html {redirect_to reset_meals_path, alert: "Only Reset #{ih_status.count(true)} In House Meals and #{ooh_status.count(true)} Out of House Meals"}
      end
    end
  end

  private
  def meal_params
    params.require(:meal).permit(:member_id, :date, :start_date, :end_date, :lunch, :lunch_qty, :dinner, :dinner_qty)
  end

  def start_of_semester
    if Date.today.month >= 8 #August or later
      Date.new(Date.today.year, 8, 1)
    else
      Date.new(Date.today.year, 1, 1)
    end 
  end
end