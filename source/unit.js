
/**
 * This class represents one unit of measure.  It includes
 * functions to cover constructor, accessor, and assignment tasks as
 * well as operators to calculate multiplication, division and raising
 * to a power.
 *
 * @author Lee Mericle, based on java version by Gunther Schadow
 *
 */
var Dimension = require('./dimension.js').Dimension;
var UcumFunctions = require("./ucumFunctions.js").UcumFunctions;
var isInteger = require("is-integer");

export class Unit {

  /**
   * Constructor.
   *
   * @param attrs an optional parameter that may be:
   *  a string, which is parsed by the unit parser, which creates
   *  the unit from the parsed string; or
   *  a hash containing all or some values for the attributes of
   *  the unit, where the keys are the attribute names, without a
   *  trailing underscore, e.g., name instead of name_; or
   *  null, in which case an empty hash is created and used to
   *  set the values forthe attributes.
   *  If a hash (empty or not) is used, attributes for which no value
   *  is specified are assigned a default value.
   *
   */
  constructor(attrs = {}) {

    // Process the attrs hash passed in, which may be empty.
    // Create and assign values (from the attrs hash or defaults) to all
    // attributes.  From Class Declarations in Understanding ECMAScript,
    // https://leanpub.com/understandinges6/read/#leanpub-auto-class-declarations,
    //   "Own properties, properties that occur on the instance rather than the
    //    prototype, can only be created inside of a class constructor or method.
    //    It's recommended to create all possible own properties inside of the
    //    constructor function so there's a single place that's responsible for
    //    all of them."

    /*
     * Flag indicating whether or not this is a base unit
     */
    this.isBase_ = attrs['isBase_'] || false ;

    /*
     * The unit name, e.g., meter
     */
    this.name_ = attrs['name_'] || '';

    /*
     * The unit's case-sensitive code, e.g., m
     */
    this.csCode_ = attrs['csCode_'] || '';

    /*
     * The unit's case-insensitive code, e.g., M
     */
    this.ciCode_ = attrs['ciCode_'] || '';

    /*
     * The unit's property, e.g., length
     */
    this.property_ = attrs['property_'] || '';

    /*
     * The magnitude of the unit, e.g., 3600/3937 for a yard,
     * where a yard - 3600/3973 * m(eter).  The Dimension
     * property specifies the meter - which is the unit on which
     * a yard is based, and this magnitude specifies how to figure
     * this unit based on the base unit.
     */
    this.magnitude_ = attrs['magnitude_'] || 1;

    /*
     * The Dimension object of the unit
     */
    if (attrs['dim_'] !== null && attrs['dim_'] !== undefined) {
      if (attrs['dim_'] instanceof Array) {
        this.dim_ = new Dimension(attrs['dim_']);
      }
      else if (attrs['dim_'] instanceof Dimension) {
        this.dim_ = attrs['dim_'];
      }
      else if (isInteger(attrs['dim_'])) {
        this.dim_ = new Dimension(attrs['dim_']) ;
      }
      else {
        if (attrs['dim_'].dimVec_) {
          this.dim_ = new Dimension(attrs['dim_'].dimVec_);
        }
        else
          this.dim_ = new Dimension(attrs['dim_']);
      }
    }
    else {
      this.dim_ = new Dimension(null);
    }

    /*
     * The print symbol of the unit, e.g., m
     */
    this.printSymbol_ = attrs['printSymbol_'] || null;

    /*
     * The class of the unit, where given, e.g., dimless
     */
    this.class_ = attrs['class_'] || null;

    /*
     * A flag indicating whether or not the unit is metric
     */
    this.isMetric_ = attrs['isMetric_'] || false;

    /*
     * The "variable" - which I think is used only for base units
     * The symbol for the variable as used in equations, e.g., s for distance
     */
    this.variable_ = attrs['variable_'] || null ;  // comes from 'dim' in XML

    /*
     * The conversion function
     */
    this.cnv_ = attrs['cnv_'] || null;

    /*
     * The conversion prefix
     */
    this.cnvPfx_ = attrs['cnvPfx_'] || 1;

    /*
     * Flag indicating whether or not this is a "special" unit, i.e., is
     * constructed using a function specific to the measurement, e.g.,
     * fahrenheit and celsius
     */
    this.isSpecial_ = attrs['isSpecial_'] || false ;

    /*
     * Flag indicating whether or not this is an arbitrary unit
     */
    this.isArbitrary_ = attrs['isArbitrary_'] || false;

    /*
     * Added when added LOINC list of units
     * synonyms are used by the autocompleter to enhance lookup capabilities
     * while source says where the unit first shows up.  Current sources are
     * UCUM - which are units from the unitsofmeasure.org list and LOINC -
     * which are units from the LOINC data.
     */
    this.synonyms_ = attrs['synonyms_'] || null ;
    this.source_ = attrs['source_'] || null ;
    this.loincProperty_ = attrs['loincProperty_'] || null;
    this.category_ = attrs['category_'] || null;

    /*
     * Used to compute dimension; storing for now until I complete
     * unit definition parsing
     */
    /*
     * Case sensitive (cs) and case insensitive (ci) unit strings,
     * includes exponent and prefix if applicable - specified in
     * <value Unit=x UNIT=X value="nnn">nnn</value> -- the unit part --
     * in the ucum-essence.xml file, and may be specified by a user
     * when requesting conversion or validation of a unit string.
     */
    this.csUnitString_ = attrs['csUnitString_'] || null ;
    this.ciUnitString_ = attrs['ciUnitString_'] || null ;

    /*
     * String and numeric versions of factor applied to base unit specified in
     * <value Unit=x UNIT=X value="nnn">nnn</value> -- the value part
     */
    this.baseFactorStr_ = attrs['baseFactorStr_'] || null;
    this.baseFactor_ = attrs['baseFactor_'] || null;

    /*
     * Flag used to indicate units where the definition process failed
     * when parsing units from the official units definitions file
     * (currently using the ucum-essence.xml file).  We keep these
     * so that we can use them to at least validate them as valid
     * units, but we don't try to convert them.   This is temporary
     * and only to account for instances where the code does not
     * take into account various special cases in the xml file.
     *
     * This is NOT used when trying to validate a unit string
     * submitted during a conversion or validation attempt.
     */
    this.defError_ = attrs['defError_'] || false ;


  } // end constructor


  /**
   * Assign the unity (= dimensionless unit 1) to this unit.
   *
   * @return this unit
   */
  assignUnity() {
    this.name_  = "" ;
    this.magnitude_ = 1 ;
    this.dim_.assignZero() ;
    this.cnv_ = null ;
    this.cnvPfx_ = 1 ;
    return this;

  } // end assignUnity


  /**
   * This assigns one or more values, as provided in the hash passed in,
   * to this unit.
   *
   * @param vals hash of values to be assigned to the attributes
   *        specified by the key(s), which should be the attribute
   *        name without the trailing underscore, e.g., name instead
   *        of name_.
   * @return nothing
   */
  assignVals(vals) {
    for (let key in vals) {
      let uKey = !(key.charAt(key.length - 1)) === '_' ? key + '_' : key ;
      if (this.hasOwnProperty(uKey))
        this[uKey] = vals[key];
      else
        throw(new Error(`Parameter error; ${key} is not a property of a Unit`));
    }
  } // end assignVals


  /**
   * This creates a clone of this unit.
   *
   * @return the clone
   */
  clone() {
    let retUnit = new Unit() ;
    Object.getOwnPropertyNames(this).forEach(val => {
      if (val === 'dim_') {
        retUnit['dim_'] = new Dimension(this.dim_.dimVec_);
      }
      else {
        retUnit[val] = this[val];
      }
    });
    return retUnit ;

  } // end clone


  /**
   * This assigns all properties of a unit passed to it to this unit.
   *
   * @param the unit whose properties are to be assigned to this one.
   * @return nothing; this unit is updated
   */
  assign(unit2) {
    Object.getOwnPropertyNames(unit2).forEach(val => {
      if (this.val !== undefined) {
        if (val === 'dim_') {
          this['dim_'] = new Dimension(this.dim_.dimVec_);
        }
        else {
          this[val] = this[val];
        }
      }
      else
         throw(new Error(`Parameter error; ${val} is not a property of a Unit`));
    });
  } // end assign


  /**
   * This determines whether or not object properties of the unit
   * passed in are equal to the corresponding properties in this unit.
   * The following properties are the only ones checked:
   *   magnitude_, dim_, cnv_ and cnvPfx_
   *
   * @param unit2 the unit whose properties are to be checked.
   * @return boolean indicating whether or not they match
   */
  equals(unit2) {

    return (this.magnitude_ === unit2.magnitude_ &&
            this.dim_.equals(unit2.dim_) &&
            this.cnv_ === unit2.cnv_ &&
            this.cnvPfx_ === unit2.cnvPfx_);

  } // end equals


  /**
   * This returns the value of the property named by the parameter
   * passed in.
   *
   * @param propertyName name of the property to be returned, with
   *        or without the trailing underscore.
   * @return the requested property, if found for this unit
   * @throws an error if the property is not found for this unit
   */
  getProperty(propertyName) {
    let uProp = propertyName.charAt(propertyName.length - 1) === '_' ? propertyName :
                                             propertyName + '_' ;
    if (!(this.hasOwnProperty(uProp)))
      throw(new Error(`Unit does not have requested property (${propertyName}),  ` +
            `unit code = ${this.csCode_}`));
    else
      return this[uProp] ;

  } // end getProperty


  /**
   * Takes a measurement consisting of a number of units and a unit and returns
   * the equivalent number of this unit.  So, 15 mL would translate
   * to 1 tablespoon if this object is a tablespoon.
   *
   * @param num the numnitude for the unit to be translated (e.g. 15 for 15 mL)
   * @param fromUnit the unit to be translated to one of this type (e.g. a mL unit)
   *
   * @return the number of converted units (e.g. 1 for 1 tablespoon)
   * @throws an error if the dimension of the fromUnit differs from this unit's
   * dimension
   */
  convertFrom(num, fromUnit) {
    let newNum = 0.0 ;

    // reject request if the dimensions are not equal
    if (!(fromUnit.dim_.equals(this.dim_))) {
      throw(new Error(`Sorry.  ${fromUnit.csCode_} cannot be converted ` +
                      `to ${this.csCode_}.`));
    }
    let fromCnv = fromUnit.cnv_ ;
    let fromMag = fromUnit.magnitude_ ;

    // if both units are on a ratio scale, multiply the "from" unit's magnitude
    // by the number passed in and then divide that result by this unit's magnitude
    if (fromCnv == null && this.cnv_ == null)
      newNum = (num * fromMag)/this.magnitude_;

    // else use a function to get the number to be returned
    else {
      let x = 0.0 ;
      let funcs = UcumFunctions.getInstance();
      if (fromCnv != null) {
        // turn num * fromUnit.magnitude into its ratio scale equivalent
        let fromFunc = funcs.forName(fromCnv);
        x = fromFunc.cnvFrom(num * fromUnit.cnvPfx_) * fromMag;
      }
      else {
        x = num * fromMag;
      }

      if (this.cnv_ != null) {
        // turn mag * origUnit on ratio scale into a non-ratio unit
        let toFunc = funcs.forName(this.cnv_);
        newNum = toFunc.cnvTo(x / this.magnitude_) / this.cnvPfx_;
      }
      else {
        newNum = x / this.magnitude_;
      }
    } // end if both units are NOT on a ratio scale

    return newNum;

  } // end convertFrom


  /**
   * Takes a number and a target unit and returns the number for a measurement
   * of this unit that corresponds to the number of the target unit passed in.
   * So, 1 tablespoon (where this unit represents a tablespoon) would translate
   * to 15 mL.
   *
   * @param mag the magnitude for this unit (e.g. 1 for 1 tablespoon)
   * @param toUnit the unit to which this unit is to be translated
   *  (e.g. an mL unit)
   *
   * @return the converted number value (e.g. 15 mL)
   * @throws an error if the dimension of the toUnit differs from this unit's
   *   dimension
   */
  convertTo(num, toUnit) {

    return toUnit.convertFrom(num, this) ;

  } // end convertTo


  /**
   * Takes a given number of this unit returns the number of this unit
   * if it is converted into a coherent unit.  Does not change this unit.
   *
   * If this is a coherent unit already, just gives back the number
   * passed in.
   *
   * @param num the number for the coherent version of this unit
   * @return the number for the coherent version of this unit
   */
  convertCoherent(num) {

    // convert mag' * u' into canonical number * u on ratio scale
    if(this.cnv_ !== null)
      num = this.cnv_.f_from(num / this.cnvPfx_) * this.magnitude_;

    return num;

  } // end convertCoherent


  /**
   * Mutates this unit into a coherent unit and converts a given number of
   * units to the appropriate value for this unit as a coherent unit
   *
   * @param num the number for this unit before conversion
   * @return the number of this unit after conversion
   * @throws an error if the dimensions differ
   */
  mutateCoherent(num) {

    // convert mu' * u' into canonical mu * u on ratio scale
    num = this.convertCoherent(num) ;

    // mutate to coherent unit
    this.magnitude_ = 1;
    this.cnv_ = null;
    this.cnvPfx_ = 1;
    this.name_ = "";

    // build a name as a term of coherent base units
    // This is probably ALL WRONG and a HORRIBLE MISTAKE
    // but until we figure out what the heck the name being
    // built here really is, it will have to stay.
    for (let i = 0, max = Dimension.getMax(); i < max; i++) {
      let elem = this.dim_.elementAt(i);
      let uA = UnitTables.getUnitByDim(new Dimension(i));
      if(uA == null)
        throw(new Error(`Can't find base unit for dimension ${i}`));
      this.name_ = uA.name + elem;
    }
    return num;

  } // end mutateCoherent


  /**
   * Mutates this unit into a unit on a ratio scale and converts a specified
   * number of units to an appropriate value for this converted unit
   *
   * @param num the number of this unit before it's converted
   * @return the magnitude of this unit after it's converted
   * @throw an error if the dimensions differ
   */
  mutateRatio(num) {
    if (this.cnv_ == null)
      return this.mutateCoherent(num);
    else
      return num;

  } // end mutateRatio


  /**
   * Multiplies this unit with a scalar. Special meaning for
   * special units so that (0.1*B) is 1 dB.
   *
   * This function modifies this unit.
   *
   * @param s the value by which this unit is to be multiplied
   * @return this unit after multiplication
   */
  multiplyThis(s) {

    if(this.cnv_ != null)
      this.cnvPfx_ *= s;
    else
      this.magnitude_ *= s;
    return this;

  } // end multiplyThis


  /**
   * Multiplies this unit with another unit. If one of the
   * units is a non-ratio unit the other must be dimensionless or
   * else an exception is thrown. This special case treatment allows
   * us to scale non-ratio units.
   *
   * This function modifies this unit
   * @param unit2 the unit to be multiplied with this one
   * @return this unit after it is multiplied
   * @throws an error if one of the units is not on a ratio-scale
   *         and the other is not dimensionless.
   */
  multiplyThese(unit2) {
    if (this.cnv_ != null) {
      if (unit2.cnv_ == null && unit2.dim_.isZero())
	      this.cnvPfx_ *= unit2.magnitude_;
      else
	      throw (new Error(`Attempt to multiply non-ratio unit ${this.name_} ` +
                         'failed.'));
    }
    else {
      if (unit2.cnv_ != null) {
        if (this.cnv_ == null && this.dim_.isZero()) {
          let cp = this.magnitude_;
          assign(unit2);
          this.cnvPfx_ *= cp;
        }
        else
          throw (new Error(`Attempt to multiply non-ratio unit ${u2Nname}`));
      }
      else {
        this.name_ = this.mulString(this.name_, unit2.name_);
        this.csCode_ = this.mulString(this.csCode_, unit2.csCode_);
        this.magnitude_ *= unit2.magnitude_;
        // for now, putting in this safeguard to get around a known error.
        // need to put in error handling later.
        if (unit2.dim_ && unit2.dim_.dimVec_ &&
            this.dim_ && this.dim_.dimVec_)
          this.dim_.add(unit2.dim_);
      }
    }
    return this;

  } // end multiplyThese


  /**
   * Divides this unit by another unit. If this unit is not on a ratio
   * scale an exception is raised. Mutating to a ratio scale unit
   * is not possible for a unit, only for a measurement.
   *
   * This unit is modified by this function.
   * @param unit2 the unit by which to divide this one
   * @return this unit after it is divided by unit2
   * @throws an error if either of the units is not on a ratio scale.
   * */
  divide(unit2) {

    if (this.cnv_ != null)
      throw (new Error(`Attempt to divide non-ratio unit ${this.name_}`));
    if (unit2.cnv_ != null)
      throw (new Error(`Attempt to divide by non-ratio unit ${unit2.name_}`));

    //let uString = UnitString.getInstance();
    this.name_ = this.divString(this.name_, unit2.name_);
    this.csCode_ = this.divString(this.csCode_, unit2.csCode_);

    this.magnitude_ /= unit2.magnitude_;
    // for now, putting in this safeguard to get around a known error.
    // need to put in error handling later.
    if (unit2.dim_ && unit2.dim_.dimVec_ &&
        this.dim_ && this.dim_.dimVec_)
      this.dim_.sub(unit2.dim_);
    
    return this;

  }// end divide

  
  /**
   * Invert this unit with respect to multiplication. If this unit is not
   * on a ratio scale an exception is thrown. Mutating to a ratio scale unit
   * is not possible for a unit, only for a measurement (the magnitude and
   * dimension).
   *
   *  This unit is modified by this function.
   * @return this unit after being inverted
   * @throws and error if this unit is not on a ratio scale
   */
  invert() {

    if (this.cnv_ != null)
      throw (new Error(`Attempt to invert a non-ratio unit - ${this.name_}`));

    //this.name_ = UnitString.inv(this.name_);
    if (this.name_.length > 0) {
      let nameRep = this.name_.replace('/', "!").replace('.', '/').replace("!", '.');
      switch(nameRep.charAt(0)) {
        case '.' : this.name_ = nameRep.substr(1); break;
        case '/' : this.name_ = nameRep; break;
        default  : this.name_ = "/" + nameRep;
      }
    }
    this.magnitude_ = 1/this.magnitude_ ;
    this.dim_.minus();
    return this;

  } // end invert

  
  /**
   * Raises this unit to a power.  If this unit is not on a
   * ratio scale an error is thrown. Mutating to a ratio scale unit
   * is not possible for a unit, only for a measurement (magnitude
   * and dimension).
   *
   * This unit is modified by this function
   * @param p the power to with this unit is to be raise
   * @return this unit after it is raised
   * @throws an error if this unit is not on a ratio scale.
   */
  power(p) {

    if (this.cnv_ != null)
      throw (new Error(`Attempt to raise a non-ratio unit, ${this.name_}, ` +
                       'to a power.'));

    //this.name_ = UnitString.pow(this.name_, p);
    // the above line is replaced with the code below, as the pow method
    // never actually existing in the UnitString class.  (Tried to use
    // Schadow java code but this way ended up being a lot easier).
    let uStr = this.csCode_ ;
    let uArray = uStr.match(/([./]|[^./]+)/g) ;
    let arLen = uArray.length;
    for (let i = 0; i < arLen; i++) {
      let un = uArray[i] ;
      if (un !== '/' && un !== '.') {
        let nun = parseInt(un);
        if (typeof nun === 'number')
          un = (Math.pow(nun, p).toString());
        else {
          let uLen = un.length ;
          for (let u = uLen - 1; u >= 0; u--) {
            let uChar = parseInt(un[u]);
            if (typeof uChar !== 'number') {
              if (uChar === '-' || uChar === '+') {
                u--;
              }
              if (u < uLen - 1) {
                let exp = parseInt(un.substr(u));
                exp = Math.pow(exp, p);
                un = un.substr(0, u) + exp.toString();
              } // end if there are some numbers at the end
              u = -1;
            } // end if this character is not a number
          } // end searching backwards for start of exponent
        } // end if this element is not a number
      } // end if the current element is not an operator
    } // end do for each element of the units array

    // reassemble the updated units array to a string
    this.csCode_ = uArray.join('');

    this.magnitude_ = Math.pow(this.magnitude_, p);
    if (this.dim_)
      this.dim_.mul(p);
    return this;

  } // end power


  /**
   * Creates a unit string that indicates multiplication of the two
   * units referenced by the codes passed in.
   *
   * @params s1 string representing the first unit
   * @params s2 string representing the second unit
   * @returns a string representing the two units multiplied
   */
  mulString(s1, s2) {
    return s1 + "." + s2;
  }


  /**
   * Creates a unit string that indicates division of the first unit by
   * the second unit, as referenced by the codes passed in.
   *
   * @params s1 string representing the first unit
   * @params s2 string representing the second unit
   * @returns a string representing the division of the first unit by the
   * second unit
   */
  divString(s1, s2) {
    let ret = null;
    if(s2.length == 0)
      ret = s1;
    else {
      let supPos = s2.indexOf('<sup>') ;
      let s2Sup = null;
      if (supPos > 0) {
        s2Sup = s2.substr(supPos) ;
        s2 = s2.substr(0, supPos);
      }
      let t = s2.replace('/','~').replace('.','/').replace('~','.');

      switch (t[0]) {
        case '.':
          ret = s1 + t;
          break ;
        case '/':
          ret =  s1 + t;
          break;
        default:
          ret = s1 + "/" + t;
      }
      if (s2Sup)
        ret += s2Sup;
    }
    return ret ;

  } // end divString

} // end Unit class
