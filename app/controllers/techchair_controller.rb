class TechchairController < ApplicationController
  def index
    params[:admin] = true
  end
end