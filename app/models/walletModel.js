

const mongoose = require('mongoose');
const walletSchema = new mongoose.Schema(
{
   
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

      Balance: {type:Number,required:true},  
      History: [ 
        {
          TransactionType:  { type: String, required: true, unique: true },  // Type of transaction (e.g., credit, debit)
          Amount:  {type:Number,required:true},  // Amount of the transaction
          Date: { type: Date, default: null} 
        }
      ]
    }
  ,{ timestamps: true });
  const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
