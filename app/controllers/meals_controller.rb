class MealsController < ApplicationController
  def index

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

  def meal_params
    params.require(:meal).permit(:member_id, :date, :lunch, :lunch_qty, :dinner, :dinner_qty)
  end
end