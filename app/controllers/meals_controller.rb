class MealsController < ApplicationController
  def index
    @treasurer = Treasurer.new(
      start_date: (params[:treasurer] && params[:treasurer][:start_date]) || start_of_semester,
      end_date: (params[:treasurer] && params[:treasurer][:end_date]) || Date.today
    )
  end

  def csv_export
    @treasurer = Treasurer.new(
      start_date: params[:start_date],
      end_date: params[:end_date]
    )

    respond_to do |format|
      format.csv {send_data @treasurer.to_csv, filename: "Extra Meals From #{@treasurer.start_date.to_date.strftime("%-m-%-d-%y")} to #{@treasurer.end_date.to_date.strftime("%-m-%-d-%y")}.csv"}
    end
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

  def meals_ajax
    member = Member.find_by(member_id: params[:member_id])
    date = params[:date].to_date
    @meal = Meal.where(member_id: member.member_id, date: date).first

    if @meal.blank?
      @meal = Meal.new()
      @meal.lunch_qty = 1
      @meal.dinner_qty = 1
      wm = WeeklyMeal.find_by(member_id: member.member_id)

      case date.wday()
      when 1 #Monday
        @meal.lunch = wm.mon_lunch
        @meal.dinner = wm.mon_dinner
      when 2 #Tueday
        @meal.lunch = wm.tue_lunch
        @meal.dinner = wm.tue_dinner
      when 3 #Wednesday
        @meal.lunch = wm.wed_lunch
        @meal.dinner = wm.wed_dinner
      when 4 #Thursday
        @meal.lunch = wm.thu_lunch
        @meal.dinner = wm.thu_dinner
      when 5 #Friday
        @meal.lunch = wm.fri_lunch
        @meal.dinner = wm.fri_dinner
      else
        if member.in_house?
          @meal.lunch = "LI"
          @meal.dinner = "DI"
        else
          @meal.lunch = "LO"
          @meal.dinner = "DO"
        end
      end
    end

    respond_to do |format|
      format.js
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
    ih_status = Member.where(status: "I").or(Member.where(status: "N")).map do |member|
      weekly_meal = WeeklyMeal.find_by(member_id: member.member_id).update(WeeklyMeal.in_meals)
    end

    ooh_status = Member.where(status: "O").or(Member.where(status: "A")).map do |member|
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