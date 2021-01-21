class MealsController < ApplicationController
  def index
    start_date = params[:treasurer] && params[:treasurer][:start_date]
    end_date = params[:treasurer] && params[:treasurer][:end_date]
    @treasurer = Treasurer.new(
      start_date: start_date || Date.today - 1.month,
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
    @meal_list = MealList.new(
      start_date: start_date || Date.today,
      end_date: end_date || Date.today,
      member_id: member_id
    )
  end

  def late_plates
  end

  def cook
    date = params[:cook] && params[:cook][:date]
    @cook = Cook.new(date: date || Date.today)
  end

  private
  def meal_params
    params.require(:meal).permit(:member_id, :date, :start_date, :end_date, :lunch, :lunch_qty, :dinner, :dinner_qty)
  end
end