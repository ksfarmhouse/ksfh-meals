class CrewNumber < ApplicationRecord
  def password=(value)
    raise "Password must be at least 8 characters" if value.length < 8
    super encrypt(value)
  end

  def password_correct?(value)
    encrypt(value) == password
  end

  private
  def encrypt(value)
    (32 - value.length).times do |num|
      value += (num % 10).to_s
    end
    cipher = OpenSSL::Cipher::AES256.new(:CBC)
    cipher.encrypt
    cipher.key = value
    ciphertext = cipher.update(value) + cipher.final
    Base64.strict_encode64(ciphertext)
  end
end