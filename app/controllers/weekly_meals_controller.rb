class WeeklyMealsController < ApplicationController
  def index
    @weekly_meals = WeeklyMeal.new
  end

  def edit
    @weekly_meals = WeeklyMeal.where(member_id: params[:weekly_meal][:member_id])
    respond_to do |format|
      if @weekly_meals.blank?
        format.html {redirect_to weekly_meals_path, alert: "Member ID Not Found!"}
      else
        @weekly_meals = @weekly_meals.first!
        format.html
      end
    end
  end

  def update
    @weekly_meals = WeeklyMeal.where(member_id: params[:weekly_meal][:member_id]).first!
    respond_to do |format|
      if @weekly_meals.update(weekly_meals_params)
        format.html {redirect_to weekly_meals_path(@weekly_meals), notice: "Weekly Meals Updated!"}
      else
        format.html {redirect_to weekly_meals_path(@weekly_meals), notice: "Unable to Save Weekly Meals!"}
      end
    end
  end

  private
  def weekly_meals_params
    params.require(:weekly_meal).permit(:member_id, 
      :mon_lunch, :mon_dinner,
      :tue_lunch, :tue_dinner,
      :wed_lunch, :wed_dinner,
      :thu_lunch, :thu_dinner,
      :fri_lunch, :fri_dinner)
  end
end